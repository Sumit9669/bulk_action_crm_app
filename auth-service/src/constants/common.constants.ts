export const statusCodes = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,

    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

export const errorMessages={
    AUTH_ACCESS_ERROR:'Invalid Token or Unauthorized Access!',
    AUTH_TOKEN_MISSING:'Authorization Token is missing!',
    AUTH_TOKEN_EXPIRED:'Token Expired'

}