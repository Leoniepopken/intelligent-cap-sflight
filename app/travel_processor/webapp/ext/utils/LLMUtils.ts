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

    using { Currency, custom.managed, sap.common.CodeList } from './common';
    using {
      sap.fe.cap.travel.Airline,
      sap.fe.cap.travel.Passenger,
      sap.fe.cap.travel.TravelAgency,
      sap.fe.cap.travel.Supplement,
      sap.fe.cap.travel.Flight
    } from './master-data';

    namespace sap.fe.cap.travel;

    entity Travel : managed {
      key TravelUUID : UUID;
      TravelID       : Integer default 0 @readonly;
      BeginDate      : Date @mandatory;
      EndDate        : Date @mandatory;
      BookingFee     : Decimal(16,3) default 0;
      TotalPrice     : Decimal(16,3) @readonly;
      CurrencyCode   : Currency default 'EUR';
      Description    : String(1024);
      TravelStatus   : Association to TravelStatus default 'O' @readonly;
      to_Agency      : Association to TravelAgency @mandatory;
      to_Customer    : Association to Passenger @mandatory;
      to_Booking     : Composition of many Booking on to_Booking.to_Travel = $self;
    };

    annotate Travel with @Capabilities.FilterRestrictions.FilterExpressionRestrictions: [
      { Property: 'BeginDate', AllowedExpressions : 'SingleRange' },
      { Property: 'EndDate', AllowedExpressions : 'SingleRange' }
    ];


    entity Booking : managed {
      key BookingUUID   : UUID;
      BookingID         : Integer @Core.Computed;
      BookingDate       : Date;
      ConnectionID      : String(4) @mandatory;
      FlightDate        : Date @mandatory;
      FlightPrice       : Decimal(16,3) @mandatory;
      CurrencyCode      : Currency;
      BookingStatus     : Association to BookingStatus default 'N' @mandatory;
      to_BookSupplement : Composition of many BookingSupplement on to_BookSupplement.to_Booking = $self;
      to_Carrier        : Association to Airline @mandatory;
      to_Customer       : Association to Passenger @mandatory;
      to_Travel         : Association to Travel;
      to_Flight         : Association to Flight on  to_Flight.AirlineID = to_Carrier.AirlineID
                                                and to_Flight.FlightDate = FlightDate
                                                and to_Flight.ConnectionID = ConnectionID;
    };

    entity BookingSupplement : managed {
      key BookSupplUUID   : UUID;
      BookingSupplementID : Integer @Core.Computed;
      Price               : Decimal(16,3) @mandatory;
      CurrencyCode        : Currency;
      to_Booking          : Association to Booking;
      to_Travel           : Association to Travel;
      to_Supplement       : Association to Supplement @mandatory;
    };


    //
    //  Code Lists
    //

    type BookingStatusCode : String(1) enum {
      New      = 'N';
      Booked   = 'B';
      Canceled = 'X';
    };

    entity BookingStatus : CodeList {
      key code : BookingStatusCode
    };

    type TravelStatusCode : String(1) enum {
      Open     = 'O';
      Accepted = 'A';
      Canceled = 'X';
    };

    entity TravelStatus : CodeList {
      key code : TravelStatusCode;
      // can't use UInt8 (which would automatically be mapped to Edm.Byte) because it's not supported on H2
      fieldControl: Int16 @odata.Type:'Edm.Byte' enum {
        Inapplicable = 0;
        ReadOnly = 1;
        Optional = 3;
        Mandatory = 7;
      };
      createDeleteHidden: Boolean;
      insertDeleteRestriction: Boolean; // = NOT createDeleteHidden
    }

    extend entity Travel with {
      GoGreen        : Boolean default false;
      GreenFee       : Decimal(16, 3) @Core.Computed @readonly;
      TreesPlanted   : Integer @Core.Computed @readonly;  
    };

    type LLMResponse {
      response : LargeString;
    }

    Build the query using the SAP Query Notation. Here are some examples how to construct such a query:
    
    SELECT.from(Travel).where("TravelStatus = 'A'");
    SELECT(['title', 'price']).from('Books').where("genre = 'Fiction'");
    SELECT.from('Orders').join('Books').on('Orders.book_id = Books.id').where('Books.author'= 'Jane Doe' );
    SELECT.from('Books').orderBy('price', 'desc');
    SELECT.from('Books').limit(10).offset(20);

    Answer by giving me only the query, nothing more. Only give one answer.

    This is a valid answer: SELECT.from(Travel).where("TravelStatus = 'A'")

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
  template: String,
  systemRole: String,
  content: any
): Promise<String | undefined> {
  try {
    const isQueryResult = await isQuery(oView, content);

    console.log("isQueryResult: " + isQueryResult);

    if (isQueryResult) {
      const query = await transformToQuery(oView, content);
      console.log("Query: " + query);
      const queryResult = await invokeQueryAction(oView, query);
      console.log(queryResult);
    }

    return await invokeLLMAction(oView, template, systemRole, content);
  } catch (err) {
    console.log("An error occurred:", err);
  }
}
