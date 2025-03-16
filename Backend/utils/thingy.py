# utils/thingy.py
import requests

class Duck:
    def __init__(self, base_url='http://141.148.195.240:5000'):
        self.base_url = base_url

    def send_info(self, name, address, link, latitude, longitude):
        # Check if the data already exists
        list_url = f'{self.base_url}/list'
        response = requests.get(list_url)
        if response.status_code == 200:
            existing_data = response.json()
            for item in existing_data:
                if item.get("name") == name and item.get("address") == address and item.get("link") == link and item.get("lat") == latitude and item.get("lon") == longitude:
                    return 409, {"message": "Data already exists"}

        # Append the data if it doesn't exist
        url = f'{self.base_url}/append'
        headers = {'Content-Type': 'application/json'}
        data = {
            "name": name,
            "address": address,
            "mapLink": link,
            "lat": latitude,
            "lon": longitude,
        }

        response = requests.post(url, headers=headers, json=data)
        return response.status_code, response.json()

    def remove_info(self, name, address, link, latitude, longitude):
        url = f'{self.base_url}/remove'
        headers = {'Content-Type': 'application/json'}
        data = {
            "name": name,
            "address": address,
            "mapLink": link,
            "lat": latitude,
            "lon": longitude,
        }

        response = requests.post(url, headers=headers, json=data)
        return response.status_code, response.json()
