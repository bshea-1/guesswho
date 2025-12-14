export type CharacterAttributes = {
  gender: string;
  hairColor: string;
  glasses: boolean;
  hat: boolean;
  facialHair: boolean;
  [key: string]: any;
};

export type Character = {
  id: string;
  name: string;
  image: string;
  attributes: CharacterAttributes;
};

export const CHARACTERS: Character[] = [
  {
    "id": "al",
    "name": "Al",
    "image": "/characters/Al.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Red",
      "glasses": true,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "amy",
    "name": "Amy",
    "image": "/characters/Amy.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Brown",
      "glasses": false,
      "hat": true,
      "facialHair": true
    }
  },
  {
    "id": "ben",
    "name": "Ben",
    "image": "/characters/Ben.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "White",
      "glasses": false,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "carmen",
    "name": "Carmen",
    "image": "/characters/Carmen.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Brown",
      "glasses": true,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "daniel",
    "name": "Daniel",
    "image": "/characters/Daniel.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Red",
      "glasses": false,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "david",
    "name": "David",
    "image": "/characters/David.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Red",
      "glasses": false,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "emma",
    "name": "Emma",
    "image": "/characters/Emma.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Black",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "eric",
    "name": "Eric",
    "image": "/characters/Eric.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "White",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "farah",
    "name": "Farah",
    "image": "/characters/Farah.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Black",
      "glasses": false,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "gabe",
    "name": "Gabe",
    "image": "/characters/Gabe.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Brown",
      "glasses": true,
      "hat": true,
      "facialHair": true
    }
  },
  {
    "id": "joe",
    "name": "Joe",
    "image": "/characters/Joe.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Brown",
      "glasses": false,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "jordan",
    "name": "Jordan",
    "image": "/characters/Jordan.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Blonde",
      "glasses": true,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "katie",
    "name": "Katie",
    "image": "/characters/Katie.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Brown",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "laura",
    "name": "Laura",
    "image": "/characters/Laura.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "White",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "leo",
    "name": "Leo",
    "image": "/characters/Leo.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Blonde",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "lily",
    "name": "Lily",
    "image": "/characters/Lily.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Black",
      "glasses": true,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "liz",
    "name": "Liz",
    "image": "/characters/Liz.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "White",
      "glasses": true,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "mia",
    "name": "Mia",
    "image": "/characters/Mia.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Brown",
      "glasses": true,
      "hat": true,
      "facialHair": true
    }
  },
  {
    "id": "mike",
    "name": "Mike",
    "image": "/characters/Mike.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Red",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "nick",
    "name": "Nick",
    "image": "/characters/Nick.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Red",
      "glasses": false,
      "hat": true,
      "facialHair": true
    }
  },
  {
    "id": "olivia",
    "name": "Olivia",
    "image": "/characters/Olivia.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Blonde",
      "glasses": true,
      "hat": false,
      "facialHair": true
    }
  },
  {
    "id": "rachel",
    "name": "Rachel",
    "image": "/characters/Rachel.png",
    "attributes": {
      "gender": "Male",
      "hairColor": "Blonde",
      "glasses": true,
      "hat": true,
      "facialHair": true
    }
  },
  {
    "id": "sam",
    "name": "Sam",
    "image": "/characters/Sam.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Brown",
      "glasses": false,
      "hat": false,
      "facialHair": false
    }
  },
  {
    "id": "sophia",
    "name": "Sophia",
    "image": "/characters/Sophia.png",
    "attributes": {
      "gender": "Female",
      "hairColor": "Black",
      "glasses": true,
      "hat": false,
      "facialHair": false
    }
  }
];
