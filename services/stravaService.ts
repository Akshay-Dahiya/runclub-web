import axios from 'axios'

export async function fetchStravaActivities(accessToken: string) {
  const resp = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { per_page: 50 }
  })
  return resp.data
}
