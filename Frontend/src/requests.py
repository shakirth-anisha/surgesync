import requests

def send_info(name, address):
    url = 'http://141.148.195.240:5000/append'
    headers = {'Content-Type': 'application/json'}
    data = {
        "name": name,
        "address": address
    }

    response = requests.post(url, headers=headers, json=data)
    return response.status_code, response.json()

def remove_info(name, address):
    url = 'http://141.148.195.240:5000/remove'
    headers = {'Content-Type': 'application/json'}
    data = {
        "name": name,
        "address": address
    }

    response = requests.post(url, headers=headers, json=data)
    return response.status_code, response.json()