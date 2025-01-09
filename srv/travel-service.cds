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

  action invokeLLM(
    content: String @Core.OptionalParameter : { $Type : 'Core.OptionalParameterType'}, 
    tone : String, 
    maxTokens: Integer, 
    temperature: Double, 
    template: String, 
    systemRole: String
  ) returns String;

  action executeQuery(query : String) returns String;

}

type Percentage : Integer @assert.range: [1,100];
