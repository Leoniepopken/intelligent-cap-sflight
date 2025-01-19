export async function invokeQueryAction(oView: any, query: any) {
  try {
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    const response = await oEditFlow.invokeAction(
      "TravelService.EntityContainer/executeQuery",
      {
        model: oEditFlow.getView().getModel(),
        parameterValues: [
          {
            name: "query",
            value: query,
          },
        ],
        skipParameterDialog: true,
      }
    );

    return response.value;
  } catch (err) {
    return err;
  }
}
