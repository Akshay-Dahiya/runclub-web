import unittest
from datetime import date
from unittest.mock import Mock

from sync_garmin import get_activities, get_wellness, merge_activities


class GarminSyncTests(unittest.TestCase):
    def test_extracts_supported_wellness_data(self):
        client = Mock()
        client.get_sleep_data.return_value = {
            "sleepTimeSeconds": 25200,
            "sleepScores": {"overall": {"value": 84}},
        }
        client.get_heart_rates.return_value = {"restingHeartRate": 48}
        client.get_hrv_data.return_value = {"hrvSummary": {"lastNightAvg": 72}}
        client.get_all_day_stress.return_value = {"avgStressLevel": 31}
        client.get_body_battery.return_value = [{"bodyBatteryValuesArray": [[1, 28], [2, 96]]}]
        client.get_training_readiness.return_value = [{"score": 81}]
        client.get_user_summary.return_value = {"totalSteps": 11240}

        metrics = get_wellness(client, date(2026, 6, 28))
        self.assertEqual(metrics["sleepHours"], 7)
        self.assertEqual(metrics["sleepScore"], 84)
        self.assertEqual(metrics["hrvMs"], 72)
        self.assertEqual(metrics["restingHeartRate"], 48)
        self.assertEqual(metrics["bodyBatteryStart"], 28)
        self.assertEqual(metrics["bodyBatteryEnd"], 96)
        self.assertEqual(metrics["averageStress"], 31)
        self.assertEqual(metrics["steps"], 11240)
        self.assertEqual(metrics["trainingReadiness"], 81)

    def test_activity_sync_filters_to_run_and_deduplicates_updates(self):
        client = Mock()
        client.get_activities_by_date.return_value = [
            {
                "activityId": 123,
                "activityName": "Morning run",
                "activityType": {"typeKey": "running"},
                "startTimeLocal": "2026-06-28T07:00:00",
                "distance": 5000,
                "duration": 1500,
                "averageHR": 150,
            },
            {
                "activityId": 124,
                "activityName": "Ride",
                "activityType": {"typeKey": "cycling"},
                "startTimeLocal": "2026-06-28T08:00:00",
                "distance": 15000,
                "duration": 1800,
            },
        ]
        activities = get_activities(client, date(2026, 6, 28), date(2026, 6, 28))
        self.assertEqual(len(activities), 1)
        self.assertEqual(activities[0]["distanceKm"], 5)

        merged = merge_activities(
            [{"activityId": "123", "name": "Old title", "date": "2026-06-28"}],
            [{"activityId": "123", "name": "Updated title", "date": "2026-06-28"}],
        )
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["name"], "Updated title")


if __name__ == "__main__":
    unittest.main()
