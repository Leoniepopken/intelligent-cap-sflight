export async function invokeQueryAction(oView: any, query?: String) {
  try {
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    const response = await oEditFlow.invokeAction(
      "TravelService.EntityContainer/executeQuery",
      {
        model: oEditFlow.getView().getModel(),
        // TODO: use query parameter from input
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
