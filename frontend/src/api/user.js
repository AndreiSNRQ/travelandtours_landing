import AUTH_API from "./axios";

export const getEnterpriseUsers = async () => {
    return AUTH_API.get("/api/auth/sa/users");
};

export const updateUserRole = async (userId, role) => {
    return AUTH_API.patch(`/api/auth/sa/users/${userId}/role`, { role });
};

export const createEnterpriseUser = async (userData) => {
    return AUTH_API.post("/api/auth/sa/users", userData);
};

export const getUserMetadata = async () => {
    return AUTH_API.get("/api/auth/sa/metadata");
};

export const getUnmappedEmployees = async () => {
    return AUTH_API.get("/api/auth/sa/unmapped-employees");
};
