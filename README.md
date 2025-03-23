# Bulk Action Platform for CRM Application

## Objective:

Develop a highly scalable and efficient bulk action platform capable of performing various bulk actions on CRM entities. It should be flexible, and adding new bulk actions should be easy. The system should be able to handle large volumes of data (up to a million entities) with high performance, extendability, and robust error handling.

## Detailed Core Requirements:

### Entities and Actions:
- **CRM Entities**: Contacts, Companies, Leads, Opportunities, Tasks, etc.
- **Initial Bulk Action**: Develop a Bulk Update feature allowing updates to multiple fields for an entity.

### Bulk Update Action:
- **Fields**: Enable updating of various fields like name, email, status, etc.
- **Batch Processing**: Design the system to handle updates in batches for efficiency and reduced load.

### Performance and Scalability:
- **Load Testing**: The system should be tested for processing thousands of entities per minute.
- **Horizontal Scaling**: Design to accommodate increasing load by scaling out.

### Logging and Statistics:
- **Detailed Logs**: Capture success and error details for each processed entity.
- **Statistics**: Create an API endpoint to return a summary of the bulk action, including success, failure, and skipped counts.

### User Interface (UI) Interaction (Only API, UI implementation not required):
- **Action Status**: Display ongoing, completed, and queued actions.
- **Progress Tracking**: Show real-time progress of current bulk actions.
- **Log Retrieval**: Facility to fetch and filter logs via the UI.

### Extensibility:
- **Modular Design**: Ensure the architecture is modular to easily add new bulk actions.
- **Code Reusability**: Focus on reusing existing code for future bulk actions with minimal changes.

### API and Documentation:
- **Postman Collection**: Provide a comprehensive Postman collection for all API endpoints.
- **Loom**: Create a Loom video explaining the architecture and giving a demo.

## Technical Stack:
- **Backend Framework**: Node.js for the backend.
- **Database and Queuing**: Choose any database and queuing systems depending on the data structure and scalability needs.

## Optional Enhancements:
### Rate Limiting:
- Each account should be limited to a rate limit. Add an `accountId` for each bulk action based on which you can check for the rate limits.
- No account should be able to exceed a rate limit of 10k events per minute or any other rate limit that you decide.

### De-duplication:
- Develop a method to identify and skip duplicate entities based on the 'email' field.
- All the skipped entities should show up in logs marking them as skipped.

### Scheduling:
- Ability to schedule a bulk action for the future. E.g., a bulk action that will start on 22 Nov at 11:15pm.

## Detailed Endpoint Specifications

### Bulk Action List Endpoint:
- `GET /bulk-actions`
  - Lists all the bulk actions.

### Bulk Action Creation Endpoint:
- `POST /bulk-actions`
  - Creates a new bulk action.

### Bulk Action Status Endpoint:
- `GET /bulk-actions/{actionId}`
  - Retrieves the details about the bulk action.
  
- `GET /bulk-actions/{actionId}/stats`
  - Retrieves a summary of the bulk action, including success, failure, and skipped counts.

## Workflow for Performing Bulk Operations:
- Users can hit the **POST** API for `bulk-actions` and upload a **CSV file** containing the data.
- Based on the action passed, users will either be able to insert data into the database or update existing data.

## Authentication & Authorization:
For accessing the APIs of the CRM, authentication and authorization are required. Please follow the steps below:

1. **Run** the `auth-service` microservice and the `cms-service`.
2. Call the `auth-service/register` API with the payload as:
   ```json
   {
     "name": "Your Name",
     "username": "yourUsername",
     "email": "youremail@example.com",
     "password": "yourPassword"
   }
3. After registering the user successfully, call the **login** API with the payload as:

    ```json
    {
    "email": "youremail@example.com",
    "password": "yourPassword"
    }

4. Use the **access token** created in the third step as the **Authorization Bearer Token** in the `cms-service` to access endpoints and perform bulk actions.

## Postman Collection:
A comprehensive **Postman collection** for API testing has been provided. You can download the collection [here](https://drive.google.com/file/d/1qR6knv6_sWWw8xLqTeTAwlM1R_zI7Hj-/view?usp=drive_link).

## Loom Video:
A **Loom video** explaining the architecture and providing a demo of the platform can be viewed [here](https://www.loom.com/share/8ca6bef546b542c8b4045a862850d80c).

## Setup Instructions:

### Prerequisites:
- Node.js
- TypeScript
- MongoDB (or any other database you prefer)
- Postman for testing APIs

### Steps to Run the Project:

1. **Clone the repository**:

   ```bash
   git clone "repository name"
2. npm i

3. open separate terminal for both auth-service and cms-service directory

4. setup .env by taking refrence from default.env
5. use npm run start for both project
6. Create Token user register and login API as mention in authrizationa and authentication step
7. Hit cms service post API **http://localhost:3003/cms-service/bulk-actions/0**
   make sure to pass following data in payload
   ```bash
    > in Authrization pass bearer token
    > set form data for request body
    > pass action  as 0 to insert and 1 to update
    > second key select file and for key csvFile upload file
    > if data required to be scheduled at particular time pass key scheduleTime and value as time string
    
    curl request example

    
    curl --location 'http://localhost:3003/    cms-service/bulk-actions/0' \--header 'Authorization: Bearer     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.    eyJpZCI6IjY3ZGRiMTEyNWEwOTEzNWUyZjI5NjR    iYyIsImlhdCI6MTc0MjYzMDc2NCwiZXhwIjoxNz    QyNjMyNTY0LCJpc3MiOiJidWxrX0FjdGlvbl9jc    m1fYXBwIn0.    C9OF0pVAK6yWvgeU32a5tuTD_Ts4mkz-F0Po94M    mol0' \--form 'csvFile=@"/C:/Users/sumit/    Downloads/Untitled spreadsheet -     Sheet1 (2).csv"' \--form 'scheduleTime="Sat Mar 22 2025     08:52:17 GMT+0530 (India Standard Time)    "' \--form 'action="0"'

8. To get current all task status
   ```bash
   > hit get API **http://localhost:3000/cms-service/bulk-actions**
   > curl request

    curl --location --request GET 'http://localhost:3000/cms-service/bulk-actions' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MmQ0ZTM0ZjAxYjkwMDljZmZlNWY4NyIsImlhdCI6MTczOTg4MTMzMSwiZXhwIjoxNzQxMTc3MzMxLCJpc3MiOiJrYXJtYWxlYWd1ZSJ9.JRUYZiCnNiY0w_N9odF3icRHl59-sGxRQdeBOIz2VVg' \

9. To get stats detail for particular ongoing task or completed task
   
    ```bash
    > Hit API **http://localhost:3000/cms-service/bulk-actions/67dc76b9ee9444b910b69d00/stat**
    > curl request

    curl --location --request GET 'http://localhost:3000/cms-service/bulk-actions/67dc76b9ee9444b910b69d00/stat' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MmQ0ZTM0ZjAxYjkwMDljZmZlNWY4NyIsImlhdCI6MTczOTg4MTMzMSwiZXhwIjoxNzQxMTc3MzMxLCJpc3MiOiJrYXJtYWxlYWd1ZSJ9.JRUYZiCnNiY0w_N9odF3icRHl59-sGxRQdeBOIz2VVg' \



