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
  additionalContent?: any
): Promise<String | undefined> {
  try {
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    // Retrieve any stored hyperparameters (if they exist)
    const hyperparams = (oController as any)._hyperparams || {};
    const tone = hyperparams.tone || "";
    const tokens = hyperparams.maxTokens || 100;
    const temperature = hyperparams.temperature || 0.1;

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
  const template = `You are given the following request: {{?content}}
    Transform this request into a query to be able to query the oData service of my application.
    This is my schema.cds:

    These are my tables:

    [
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
    ]

    These are the columns of my Travel table:

    [
      {
        cid: 0,
        name: 'createdAt',
        type: 'TIMESTAMP_TEXT',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 1,
        name: 'createdBy',
        type: 'NVARCHAR(255)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 2,
        name: 'LastChangedAt',
        type: 'TIMESTAMP_TEXT',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 3,
        name: 'LastChangedBy',
        type: 'NVARCHAR(255)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 4,
        name: 'TravelUUID',
        type: 'NVARCHAR(36)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 5,
        name: 'TravelID',
        type: 'INTEGER',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 6,
        name: 'BeginDate',
        type: 'DATE_TEXT',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 7,
        name: 'EndDate',
        type: 'DATE_TEXT',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 8,
        name: 'BookingFee',
        type: 'DECIMAL(16, 3)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 9,
        name: 'TotalPrice',
        type: 'DECIMAL(16, 3)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 10,
        name: 'CurrencyCode_code',
        type: 'NVARCHAR(3)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 11,
        name: 'Description',
        type: 'NVARCHAR(1024)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 12,
        name: 'TravelStatus_code',
        type: 'NVARCHAR(1)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 13,
        name: 'to_Agency_AgencyID',
        type: 'NVARCHAR(6)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 14,
        name: 'to_Customer_CustomerID',
        type: 'NVARCHAR(6)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 15,
        name: 'GoGreen',
        type: 'BOOLEAN',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 16,
        name: 'GreenFee',
        type: 'DECIMAL(16, 3)',
        notnull: 0,
        dflt_value: null,
        pk: 0
      },
      {
        cid: 17,
        name: 'TreesPlanted',
        type: 'INTEGER',
        notnull: 0,
        dflt_value: null,
        pk: 0
      }
    ]

    Answer by giving me only the raw query as plain text, without using code blocks, formatting, or additional explanations. 
    Only provide one answer.

    This is a valid answer for the request 'Give me one travel with status accepted': 
    SELECT * FROM sap_fe_cap_travel_Travel WHERE TravelStatus_code = 'A' LIMIT 1

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
  content: any
): Promise<string | undefined> {
  try {
    let finalResponse = "";

    // 1. Check if the content is a query
    const isQueryResult = await isQuery(oView, content);
    console.log("isQueryResult:", isQueryResult);

    let csvDownloadLink = "";

    if (isQueryResult) {
      // 2. Transform the text into a SQL query
      const query = await transformToQuery(oView, content);
      console.log("Query:", query);

      // 3. Invoke the backend action to run the query
      const queryResult = await invokeQueryAction(oView, query);
      console.log("QueryResult:", queryResult);

      // 4. If we have rows, convert them to CSV and generate a data URL link
      if (Array.isArray(queryResult) && queryResult.length > 0) {
        const csvContent = convertToCSV(queryResult);

        const csvBlob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const csvUrl = URL.createObjectURL(csvBlob);

        // Build an HTML link for download (object URL is shorter & more efficient than data URI)
        csvDownloadLink = `<br><br><a href="${csvUrl}" download="results.csv">Download CSV</a>`;
      }
    }

    // 5. Call the LLM service to generate text
    const llmResponse = await invokeLLMAction(
      oView,
      template,
      systemRole,
      content
    );

    // 6. Combine them into a final string:
    //    LLM response plus optional CSV link
    if (llmResponse) {
      // e.g. "LLM says: ... <a ...>Download CSV</a>"
      finalResponse = llmResponse + (csvDownloadLink ? csvDownloadLink : "");
    } else {
      finalResponse = "No response from LLM";
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
