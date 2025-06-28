
import requests

# The ID of the file that was uploaded and scanned as infected
FILE_ID = 4 
BASE_URL = "http://localhost:8000"

url = f"{BASE_URL}/download/{FILE_ID}"

print(f"Attempting to download file with ID: {FILE_ID}")

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # If the file is downloaded successfully, save it
        with open(f"downloaded_file_{FILE_ID}", "wb") as f:
            f.write(response.content)
        print(f"File downloaded successfully and saved as downloaded_file_{FILE_ID}")
    else:
        # Print the error message if the download fails
        try:
            print(f"Response JSON: {response.json()}")
        except requests.exceptions.JSONDecodeError:
            print(f"Response Text: {response.text}")

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")
