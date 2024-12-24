import type {ChatCompletionMessageParam, ChatCompletionTool} from 'openai/resources/chat/completions';

export const messages: ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content:
      'You are expected to find the city Barbara Zawadzka was seen in.' +
      'Analyze the provided notes and find the names of people provided or the cities they were seen in.' +
      'Answer only in the format of a JSON object containing two non-mandatory fields: cities and names.' +
      'Spot duplicates and remove them, if the first name is used referring to people previously mentioned previously mentioned with their full names. ' +
      'Names are mentioned in Polish language, but remove the Polish characters. Change the inflection of Polish words to the nominative case.' +
      'Of the full names, return only the first name.' +
      'Replace Polish characters with English ones:' +
      'Return the result in JSON format. DO NOT WRAP WITH ```xyz ```',
  },
];
