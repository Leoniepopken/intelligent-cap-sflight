import { confirmReportDialog, handleGeneratedReport } from "./DialogUtils";

/**
 * Helper function to invoke the report backend action.
 */
export async function invokeLLMAction(
  oView: any,
  template: String
): Promise<void> {
  try {
    // 1) Ask for confirmation
    await confirmReportDialog(oView);

    // 2) Only if user confirmed, invoke the report action
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
            value: JSON.stringify(collectSelectedContent(oView)),
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

    // 3) Open your 'handleGeneratedReport' dialog afterwards
    handleGeneratedReport(response.value);

    return response.value;
  } catch (err) {
    // This 'catch' is triggered if the user pressed "No" (rejected the promise),
    // or if an error happened in the code above
    console.log("User canceled or an error occurred:", err);
  }
}

/**
 * Helper function to collect the selected content.
 */
function collectSelectedContent(oView: any) {
  const oController = oView.getController();
  const oEditFlow = oController.getExtensionAPI().editFlow;

  const contextsSelected = oEditFlow
    .getView()
    .byId(
      "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem-innerTable"
    )
    .getSelectedContexts();

  const content = contextsSelected.map((context: any) => context.getObject());

  return content;
}
