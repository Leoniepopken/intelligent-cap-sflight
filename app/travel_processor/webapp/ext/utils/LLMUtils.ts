/**
 * Helper function to invoke the report backend action.
 * @param {sap.ui.core.mvc.View} oView - The current view.
 * @param {string} template - The template to use for the report.
 * @param {string} systemRole - The system role to use for the report. This is a description string!
 * @param {any} additionalContent - The additional content to include in the LLM call.
 */
export async function invokeLLMAction(
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
    The question is if the user is asking a question about certain data and if I have to transform this request into a query. 
    Answer with one word only using true or false.
    Answer using this tone: {{?tone}}`;
  const systemRole = "You are an expert for SQl.";

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
    console.log("isQueryResult", isQueryResult);
    return await invokeLLMAction(oView, template, systemRole, content);
  } catch (err) {
    console.log("An error occurred:", err);
  }
}
