import { invokeQueryAction } from "./QueryUtils";

/**
 * Helper function to invoke the report backend action.
 * @param {sap.ui.core.mvc.View} oView - The current view.
 * @param {string} template - The template to use for the report.
 * @param {string} systemRole - The system role to use for the report. This is a description string!
 * @param {any} additionalContent - The additional content to include in the LLM call.
 */
async function invokeLLMAction({
  oView,
  template,
  systemRole,
  additionalContent,
  messageHistory,
  modelName = "gpt-4o", // Default value
}: {
  oView: any;
  template: String;
  systemRole: String;
  additionalContent?: any;
  messageHistory?: any;
  modelName?: String;
}): Promise<String | undefined> {
  try {
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    const hyperparams = (oController as any)._hyperparams || {};
    const tone = hyperparams.tone || "";
    const tokens = hyperparams.maxTokens || 100;
    const temperature = hyperparams.temperature || 0.1;

    const parameterValues: any[] = [
      {
        name: "systemRole",
        value: systemRole || "You are a helpful assistant",
      },
      { name: "tone", value: tone },
      { name: "maxTokens", value: tokens },
      { name: "temperature", value: temperature },
      { name: "template", value: template },
      { name: "modelName", value: modelName },
      ...(additionalContent
        ? [{ name: "content", value: additionalContent }]
        : []),
      ...(messageHistory
        ? [{ name: "messageHistory", value: messageHistory }]
        : []),
    ];

    const response = await oEditFlow.invokeAction(
      "TravelService.EntityContainer/invokeLLM",
      {
        model: oEditFlow.getView().getModel(),
        parameterValues,
        skipParameterDialog: true,
      }
    );

    return response.value;
  } catch (err) {
    console.log("User canceled or an error occurred:", err);
  }
}

/* This function checks if the input request is supposed to be a query */
async function isQuery(oView: any, content: any): Promise<Boolean> {
  // TODO: specify model to use
  const template = `You are given the following request: {{?content}}  
    Determine if the content is a **request** about specific data that needs to be transformed into a database query.  

    1. **Step 1: Identify if the content is a question.**  
      - If the input contains structured data (e.g., JSON) without a question, the answer is false.  
      - If the input starts with words like "Who," "What," "When," "Where," "Why," "Give me", or "How," proceed to Step 2.

    2. **Step 2: Evaluate if the request is about specific data.**  
      - Requests requiring retrieval or transformation of specific data into a database query are true.  
      - General or unrelated questions (e.g., "Is the agency trustworthy?") are false.  

    **Examples:**  
    - Content: "Which travels are starting before May 2024?" → true 
    - Content: "How can I book a flight?" → false
    - Content: JSON without a question → false  
    - Content: "Give me all travels that have been accepted" → true

    **Guidelines:** 
    - Answer with one word: true or false.  
    - If unsure, err on the side of caution and select false.  
    - Answer in the specified tone: {{?tone}}.  
    `;

  const systemRole = "You are an data expert.";

  if (isJSON(content)) {
    return false;
  }

  const answer = await invokeLLMAction({
    oView,
    template,
    systemRole,
    additionalContent: content,
    modelName: "gpt-35-turbo",
  });

  if (answer?.toLowerCase() === "true") {
    return true;
  } else {
    return false;
  }
}

async function transformToQuery(
  oView: any,
  content: any,
  // Include messageHistory to account for possible corrections by the user
  messageHistory?: any
): Promise<String | undefined> {
  // TODO: specify model to use
  const template = `**Task**
    You are provided with the following request: {{?content}}.
    Your objective is to transform this request into a query compatible with the OData service of my application.

    **Schema Information**
    Below is the schema of my application, including table names and relevant columns:

      Tables:

      sap_fe_cap_travel_Airline
      sap_fe_cap_travel_Airport
      sap_fe_cap_travel_Supplement
      sap_fe_cap_travel_Flight
      sap_fe_cap_travel_FlightConnection
      sap_fe_cap_travel_Passenger
      sap_fe_cap_travel_TravelAgency
      sap_fe_cap_travel_SupplementType
      sap_fe_cap_travel_Travel
      sap_fe_cap_travel_Booking
      sap_fe_cap_travel_BookingSupplement
      sap_fe_cap_travel_BookingStatus
      sap_fe_cap_travel_TravelStatus
      sap_common_Countries
      sap_common_Currencies

    These are the columns of sap_fe_cap_travel_Airline:
    AirlineID, Name, CurrencyCode_code

    These are the column of sap_fe_cap_travel_Airport:
    AirportID, Name, City, CountryCode_code

    These are the columns of sap_fe_cap_travel_Travel:
    createdAt, createdBy, LastChangedAt, LastChangedBy, TravelUUID, TravelID, BeginDate, EndDate, BookingFee, TotalPrice, CurrencyCode_code,
    Description, TravelStatus_code, to_Agency_AgencyID, to_Customer_CustomerID, GoGreen, GreenFee, TreesPlanted

    These are the columns of sap_fe_cap_travel_Booking:
    createdAt, createdBy, LastChangedAt, LastChangedBy, BookingUUID, BookingID, BookingDate, ConnectionID, FlightDate, FlightPrice, 
    CurrencyCode_code, BookingStatus_code, to_Carrier_AirlineID, to_Customer_CustomerID, to_Travel_TravelUUID

    These are the columns of sap_fe_cap_travel_BookingSupplement:
    BookSupplUUID, to_Travel_TravelUUID, to_Booking_BookingUUID, BookingSupplementID, to_Supplement_SupplementID, Price, CurrencyCode_code, LastChangedAt

    These are the columns of sap_fe_cap_travel_Flight:
    AirlineID, ConnectionID, FlightDate, Price, CurrencyCode_code, PlaneType, MaximumSeats, OccupiedSeats

    These are the columns of sap_fe_cap_travel_FlightConnection
    AirlineID, ConnectionID, DepartureAirport_AirportID, DestinationAirport_AirportID, DepartureTime, ArrivalTime, Distance, DistanceUnit

    These are the columns of sap_fe_cap_travel_Passenger
    CustomerID, FirstName, LastName, Title, Street, PostalCode, City, CountryCode_code, PhoneNumber, EMailAddress

    These are the columns of sap_fe_cap_travel_Supplement
    SupplementID, Price, Type_code, Description, CurrencyCode_code

    These are the columns of sap_fe_cap_travel_TravelAgency
    AgencyID, Name, Street, PostalCode, City, CountryCode_code, PhoneNumber, EMailAddress, WebAddress

    **Instructions** 
    1. Generate only the raw SQL query in plain text based on the provided request.
    2. Do not include code blocks, additional formatting, or explanations.
    3. Ensure your answer adheres to the examples provided.
    4. If the request includes specifications, for how to construct the query, make sure to follow these specifications.

    **Examples**

    Request: "Give me the latest travel with status accepted."
    Query: SELECT * FROM sap_fe_cap_travel_Travel WHERE TravelStatus_code = 'A' ORDER BY createdAt DESC LIMIT 1

    Request: "Find all travels with a booking fee below 100."
    Query: SELECT * FROM sap_fe_cap_travel_Travel WHERE BookingFee < 100

    Request: "Get the top 5 cheapest travels (by total price)."
    Query: SELECT * FROM sap_fe_cap_travel_Travel ORDER BY TotalPrice ASC LIMIT 5

    Request: "Show travels that start after January 1, 2025."
    Query: SELECT * FROM sap_fe_cap_travel_Travel WHERE BeginDate > '2025-01-01'

    Request: "Give me all accepted travels that were accepted today"
    Query: SELECT * FROM sap_fe_cap_travel_Travel WHERE TravelStatus_code = 'A' AND DATE(LastChangedAt) = CURRENT_DATE

    Answer using this tone: {{?tone}}`;

  const systemRole = "You are an expert for SQl.";

  const query = await invokeLLMAction({
    oView,
    template,
    systemRole,
    additionalContent: content,
    messageHistory,
    modelName: "gpt-4o-mini",
  });

  return query;
}

function isJSON(content: any) {
  if (typeof content !== "string") {
    return false;
  }
  try {
    JSON.parse(content);
    return true;
  } catch (e) {
    return false;
  }
}

/* This function routes the tasks. It checks what to do. */
export async function performTask(
  oView: any,
  template: string,
  systemRole: string,
  content: any,
  messageHistory?: any,
  modelName?: string
): Promise<string | undefined> {
  try {
    let finalResponse = "";
    let csvDownloadLink = "";
    let query: String | undefined;
    let queryResult: any[] | undefined;
    const model = modelName ?? "gpt-4o";

    // 1. Check if the content is a query
    const isQueryResult = await isQuery(oView, content);
    console.log("isQueryResult:", isQueryResult);

    if (isQueryResult) {
      // 2. Transform the text into a SQL query
      query = await transformToQuery(oView, content, messageHistory);
      console.log("Query: ", query);

      // 3. Invoke the backend action to run the query
      queryResult = await invokeQueryAction(oView, query);
      console.log("QueryResult: ", queryResult);

      // 4. If we have rows, convert them to CSV and generate a data URL link
      if (Array.isArray(queryResult) && queryResult.length > 0) {
        const csvContent = convertToCSV(queryResult);

        const csvBlob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const csvUrl = URL.createObjectURL(csvBlob);

        // Build an HTML link for download
        csvDownloadLink = `<br><br><a href="${csvUrl}" download="results.csv">Download CSV</a>`;
        finalResponse =
          "Sure! Here are the results: \n" +
          csvDownloadLink +
          " \n I used this query for querying the database: \n " +
          query;
      } else if (queryResult && queryResult.length === 0) {
        finalResponse =
          "For this request I couldn't find any data. I tried with the following query: " +
          query;
      } else {
        // TODO: send message history to make adaptions possible
        finalResponse =
          "The query I produced failed. This is the query I used: \n \n" +
          query +
          "Would you like to adapt the query?";
      }

      return finalResponse;
    } else {
      // 5. Call the LLM service to generate text
      const llmResponse = await invokeLLMAction({
        oView,
        template,
        systemRole,
        additionalContent: content,
        messageHistory,
        modelName: model,
      });

      // Otherwise, build the final response from the LLM’s text
      if (llmResponse) {
        return "" + llmResponse;
      } else {
        return "No response from LLM";
      }
    }
  } catch (err) {
    console.log("An error occurred:", err);
  }
}

function convertToCSV(input: any) {
  if (!input || !input.length) {
    return "";
  }

  const headers = Object.keys(input[0]);
  const csvRows = [headers.join(",")];

  for (const row of input) {
    const values = headers.map((header) => row[header]);
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}
