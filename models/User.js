const UserSchema = {
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "lastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "email": {
      "type": "string",
      "format": "email",
      "minLength": 1,
      "maxLength": 50
    },
    "password": {
      "type": "string",
      "minLength": 6
    },
    "dateOfBirth": {
      "type": "string",
      "format": "date",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "pending"]
    },
    "statusUser": {
      "type": "string",
      "enum": ["user", "admin"]
    },
    "profilePicture": {
      "type": "string",
      "default": ""
    },
    "coverPicture": {
      "type": "string",
      "default": ""
    },
    "followers": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": []
    },
    "followings": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": []
    },
    "isAdmin": {
      "type": "boolean",
      "default": false
    },
    "desc": {
      "type": "string",
      "maxLength": 50
    },
    "from": {
      "type": "string",
      "maxLength": 50
    },
    "relationship": {
      "type": "number",
      "enum": [1, 2, 3]
    }
  },
  "required": ["firstName", "lastName", "email", "password", "dateOfBirth", "status", "statusUser"]
};

module.exports = UserSchema;
