using { sap.fe.cap.travel as my } from '../db/schema';

service TravelService @(path:'/processor') {

  @(restrict: [
    { grant: 'READ', to: 'authenticated-user'},
    { grant: ['rejectTravel','acceptTravel','deductDiscount'], to: 'reviewer'},
    { grant: ['*'], to: 'processor'},
    { grant: ['*'], to: 'admin'}
  ])
  entity Travel as projection on my.Travel actions {
    action createTravelByTemplate() returns Travel;
    action rejectTravel();
    action acceptTravel();
    action deductDiscount( percent: Percentage not null ) returns Travel;
  };

  // modelName is optional because if no modelName is specified a 3.5 should be used per default. However it should be possible to
  // specify the model for each task, bc some task require way less computation power.
  action invokeLLM(
    content: String @Core.OptionalParameter : { $Type : 'Core.OptionalParameterType'}, 
    tone : String, 
    maxTokens: Integer, 
    temperature: Double, 
    template: String, 
    systemRole: String, 
    modelName: String @Core.OptionalParameter : { $Type : 'Core.OptionalParameterType'},
  ) returns String;

  action executeQuery(query : String) returns String;

}

type Percentage : Integer @assert.range: [1,100];
