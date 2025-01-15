import { invokeQueryAction } from "./QueryUtils";

/**
 * Helper function to invoke the report backend action.
 * @param {sap.ui.core.mvc.View} oView - The current view.
 * @param {string} template - The template to use for the report.
 * @param {string} systemRole - The system role to use for the report. This is a description string!
 * @param {any} additionalContent - The additional content to include in the LLM call.
 */
async function invokeLLMAction(
  oView: any,
  template: String,
  systemRole: String,
  additionalContent?: any,
  modelName?: String
): Promise<String | undefined> {
  try {
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    // Retrieve any stored hyperparameters (if they exist)
    const hyperparams = (oController as any)._hyperparams || {};
    const tone = hyperparams.tone || "";
    const tokens = hyperparams.maxTokens || 100;
    const temperature = hyperparams.temperature || 0.1;

    const model = modelName ?? "gpt-4o"; // Use provided modelName or default

    const parameterValues: any[] = [
      {
        name: "systemRole",
        value: systemRole || "You are a helpful assistent",
      },
      {
        name: "tone",
        value: tone,
      },
      {
        name: "maxTokens",
        value: tokens,
      },
      {
        name: "temperature",
        value: temperature,
      },
      {
        name: "template",
        value: template,
      },
      {
        name: "modelName", // Always include modelName with the final value
        value: model,
      },
      // Conditionally include 'content' if additionalContent is provided
      ...(additionalContent !== undefined && additionalContent !== null
        ? [
            {
              name: "content",
              value: additionalContent,
            },
          ]
        : []),
    ];

    const response = await oEditFlow.invokeAction(
      "TravelService.EntityContainer/invokeLLM",
      {
        model: oEditFlow.getView().getModel(),
        parameterValues: parameterValues,
        skipParameterDialog: true,
      }
    );

    return response.value;
  } catch (err) {
    // This 'catch' is triggered if the user pressed "No" (rejected the promise),
    // or if an error happened in the code above
    console.log("User canceled or an error occurred:", err);
  }
}

/* This function checks if the input request is supposed to be a query */
async function isQuery(oView: any, content: any): Promise<Boolean> {
  // TODO: specify model to use
  const template = `You are given the following content: {{?content}}
    The question is if the user is asking a question about certain data and if I have to transform this request 
    into a query to be able to query the database.
    
    Examples for when to answer with true:
    - "Which travels are starting before may 2024?"
    - "How many flights are accepted?"
    - "Which travel was last changed by Leonie?"
    - "To which location is the travel of Leonie going?"
    - "Is the Vaction of Leonie already paied?"
    - "How long until the next travel of Leonie?"

    Examples for when to answer with false:
    - "How can I book a flight?"
    - "Is the agency trustworthy?"

    Answer with one word only using true or false.
    Answer using this tone: {{?tone}}`;
  const systemRole = "You are an data expert.";

  if (isJSON(content)) {
    return false;
  }

  const answer = await invokeLLMAction(oView, template, systemRole, content);

  if (answer?.toLowerCase() === "true") {
    return true;
  } else {
    return false;
  }
}

async function transformToQuery(
  oView: any,
  content: any
): Promise<String | undefined> {
  // TODO: specify model to use
  const template = `You are given the following request: {{?content}}
    Transform this request into a query to be able to query the oData service of my application.
    This is my schema.cds:

    These are my tables:

      { name: 'sap_fe_cap_travel_Airline' },
      { name: 'sap_fe_cap_travel_Airport' },
      { name: 'sap_fe_cap_travel_Supplement' },
      { name: 'sap_fe_cap_travel_Flight' },
      { name: 'sap_fe_cap_travel_FlightConnection' },
      { name: 'sap_fe_cap_travel_Passenger' },
      { name: 'sap_fe_cap_travel_TravelAgency' },
      { name: 'sap_fe_cap_travel_SupplementType' },
      { name: 'sap_fe_cap_travel_Travel' },
      { name: 'sap_fe_cap_travel_Booking' },
      { name: 'sap_fe_cap_travel_BookingSupplement' },
      { name: 'sap_fe_cap_travel_BookingStatus' },
      { name: 'sap_fe_cap_travel_TravelStatus' },
      { name: 'sap_common_Countries' },
      { name: 'sap_common_Currencies' },
      { name: 'sap_fe_cap_travel_Supplement_texts' },
      { name: 'sap_fe_cap_travel_SupplementType_texts' },
      { name: 'sap_fe_cap_travel_BookingStatus_texts' },
      { name: 'sap_fe_cap_travel_TravelStatus_texts' },
      { name: 'sap_common_Countries_texts' },
      { name: 'sap_common_Currencies_texts' },
      { name: 'DRAFT_DraftAdministrativeData' },
      { name: 'TravelService_Travel_drafts' },
      { name: 'TravelService_Booking_drafts' },
      { name: 'TravelService_BookingSupplement_drafts' }

    These are the columns of my Travel table:

    createdAt, createdBy, LastChangedAt, LastChangedBy, TravelUUID, TravelID, BeginDate, EndDate, BookingFee, TotalPrice, CurrencyCode_code,
    Description, TravelStatus_code, to_Agency_AgencyID, to_Customer_CustomerID, GoGreen, GreenFee, TreesPlanted

    These are the columns of my Booking table:

    createdAt, createdBy, LastChangedAt, LastChangedBy, BookingUUID, BookingID, BookingDate, ConnectionID, FlightDate, FlightPrice, 
    CurrencyCode_code, BookingStatus_code, to_Carrier_AirlineID, to_Customer_CustomerID, to_Travel_TravelUUID

    Instruction: Answer by giving me only the raw query as plain text, without using code blocks, formatting, or additional explanations. 
    Only provide one answer.

    Here are some examples:

    Give me the latest travel with status accepted: 
    SELECT * FROM sap_fe_cap_travel_Travel WHERE TravelStatus_code = 'A' ORDER BY createdAt DESC LIMIT 1

    Find all travels with a booking fee below 100:
    SELECT * FROM sap_fe_cap_travel_Travel WHERE BookingFee < 100;

    Get the top 5 cheapest travels (by total price):
    SELECT * FROM sap_fe_cap_travel_Travel ORDER BY TotalPrice ASC LIMIT 5;

    Show travels that start after January 1, 2025:
    SELECT * FROM sap_fe_cap_travel_Travel WHERE BeginDate > '2025-01-01';

    Retrieve travels with a specific travel ID (e.g., 123):
    SELECT * FROM sap_fe_cap_travel_Travel WHERE TravelID = 123;

    List all ‘GoGreen’ travels (environment-friendly):
    SELECT * FROM sap_fe_cap_travel_Travel WHERE GoGreen = TRUE;

    Get the most recent travel by creation date:
    SELECT * FROM sap_fe_cap_travel_Travel ORDER BY createdAt DESC LIMIT 1;

    Find travels with status accepted but total price exceeding 500:
    SELECT * FROM sap_fe_cap_travel_Travel WHERE TravelStatus_code = 'A' AND TotalPrice > 500;

    Answer using this tone: {{?tone}}`;

  const systemRole = "You are an expert for SQl.";

  const query = await invokeLLMAction(oView, template, systemRole, content);

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
  modelName?: string
): Promise<string | undefined> {
  try {
    let finalResponse = "";
    const model = modelName ?? "gpt-4o";

    // 1. Check if the content is a query
    const isQueryResult = await isQuery(oView, content);
    console.log("isQueryResult:", isQueryResult);

    let csvDownloadLink = "";
    let query: String | undefined;
    let queryResult: any[] | undefined;

    if (isQueryResult) {
      // 2. Transform the text into a SQL query
      query = await transformToQuery(oView, content);
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
      }
    }

    // 5. Call the LLM service to generate text
    const llmResponse = await invokeLLMAction(
      oView,
      template,
      systemRole,
      content,
      model
    );

    // 6. Handle the "no data found" scenario
    if (isQueryResult && queryResult && queryResult.length === 0) {
      // Override finalResponse if the query returned zero rows
      finalResponse = "For this request I couldn't find any data";
      return finalResponse;
    }

    // Otherwise, build the final response from the LLM’s text
    if (llmResponse) {
      finalResponse = llmResponse + (csvDownloadLink ? csvDownloadLink : "");
    } else {
      finalResponse = "No response from LLM";
    }

    // If this was a query, include the query text
    if (isQueryResult && query) {
      finalResponse += `<br><br>I used this query for querying the database: ${query}`;
    }

    return finalResponse;
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

function downloadCSV(csvString: BlobPart, filename: string) {
  // Create a Blob with the CSV content
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  // Create a link element
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  // Append the link, trigger click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // (Optionally) Revoke the object URL
  URL.revokeObjectURL(url);
}
