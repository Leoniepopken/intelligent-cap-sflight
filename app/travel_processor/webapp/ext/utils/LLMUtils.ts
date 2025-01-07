/**
 * Helper function to invoke the report backend action.
 * @param {sap.ui.core.mvc.View} oView - The current view.
 * @param {string} template - The template to use for the report.
 * @param {any} additionalContent - The additional content to include in the LLM call.
 */
export async function invokeLLMAction(
  oView: any,
  template: String,
  additionalContent?: any
): Promise<void> {
  try {
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    // Retrieve any stored hyperparameters (if they exist)
    const hyperparams = (oController as any)._hyperparams || {};
    const tone = hyperparams.tone || "";
    const tokens = hyperparams.maxTokens || 100;
    const temperature = hyperparams.temperature || 0.1;

    const response = await oEditFlow.invokeAction(
      "TravelService.EntityContainer/invokeLLM",
      {
        model: oEditFlow.getView().getModel(),
        parameterValues: [
          {
            name: "content",
            value: additionalContent,
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
          { name: "template", value: template },
        ],
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
