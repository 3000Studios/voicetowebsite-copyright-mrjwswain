import os
from google.cloud import resourcemanager_v3

def verify_project():
    project_id = "halogen-valve-495112-c1"
    # This automatically uses the $env:GOOGLE_APPLICATION_CREDENTIALS you set
    client = resourcemanager_v3.ProjectsClient()

    try:
        project = client.get_project(name=f"projects/{project_id}")
        print(f"✅ Connection Successful!")
        print(f"Project Name: {project.display_name}")
        print(f"Project Number: {project.name.split('/')[-1]}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    verify_project()
