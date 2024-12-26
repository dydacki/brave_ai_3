import type {ChatCompletionMessageParam, ChatCompletionTool} from 'openai/resources/chat/completions';

export const visionModelMessage: ChatCompletionMessageParam = {
  role: 'user',
  content:
    'You are supposed to to interpret the find a person named Barbara Zawadzka on the image. ' +
    'If an image is broken, you may have to return a description of "Image needs to be repaired".' +
    'If an image is not clear, you may have to return a description of "Image needs to be brightened".' +
    'If an image is too dark, you may have to return a description of "Image needs to be darkened".' +
    'If an image is too bright, you may have to return a description of "Image needs to be brightened".',
};

export const messages: ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content:
      "You are supposed to head the operation of Barbara Zawadzka's picture recognition. " +
      'Based on the user message, you need to call one of the following functions' +
      'Commands can be: fetchImages, brighten, darken, repair.' +
      'Based on the user message, you will have to fetch images to be able to recognize and describe a person on those pictures.' +
      'You have to first fetch the pictures, and you may have to remove the server URL with the images URLs to be able to fetch them.' +
      '<example>https://centrala.ag3nts.org/dane/barbara_1.png -> /dane/barbara_1.png</example>' +
      'Then, you will need to use the tool functions to correct the pictures, such that their description present the person in a way that is easy to recognize. ' +
      'A correct format of the file name given to the brighten, darken or repair is: <example>barbara_1.png</example>' +
      'If the image interpretation is clear, use the image interpretation function to get the description of the person on the image.' +
      'A clear description of the person will need to be returned as a string at the end of the operation.' +
      "Pay attention to special signs like what TATOOS (an insect?) on which arm, what hair colour she has or does she wear glasses. Describe the look of person's face andi hair: eyes, colour of hair, mouth, try to estimate this presons age. " +
      'Return ONLY THE STRING DESCRIPTION OF THE PERSON, WITHOUT ADDING ANYTHING ELSE. DO NOT WRAP IT IN ANYTHING. ' +
      'RETURN YOUR DESCRIPTION SOLELY BASED ON THE PICTURES YOU FETCHED. BARBARA DOES NOT HAVE GINGER HAIR. ' +
      'The description should be in polish language. DO NOT MAKE UP THE DESCRIPTION, ONLY USE THE INFORMATION YOU HAVE.',
  },
];

export const functions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'fetchImages',
      description: 'Fetches multiple images from provided URLs',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          imageUrls: {
            type: 'array',
            items: {
              type: 'string',
              description: 'URL of the image to fetch',
            },
          },
        },
        required: ['imageUrls'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'repair',
      description: 'returns the repaired image content description based on the instructions',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {type: 'string', description: 'URL of the image to repair'},
        },
        required: ['imageUrl'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'darken',
      description: 'returns the darkened image content description based on the instructions',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {type: 'string', description: 'URL of the image to darken'},
        },
        required: ['imageUrl'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'brighten',
      description: 'returns the brightened image content description based on the instructions',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {type: 'string', description: 'URL of the image to brighten'},
        },
        required: ['imageUrl'],
        additionalProperties: false,
      },
    },
  },
];
