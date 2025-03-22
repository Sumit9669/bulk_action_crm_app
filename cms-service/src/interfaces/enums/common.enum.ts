export enum FileType {
    CONTACTS =0,
    COMPONIES,
    LEADS,
    OPPORTUNITIES,
    TASKS
}

export enum FileActions{
    INSERT=0,
    UPDATE,
    DELETE
}

export enum FileStatus{
    PENDING=0,
    IN_PROGRESS,
    COMPELTED,
    REJECTED,
    ERROR
}

export enum ValidationErrorType{
    DUPLICATE_DATA=0,
    VALDIATION_ERROR
}