import axios from "axios";

const API = axios.create({
  baseURL: "https://staff-management-system-eluv.onrender.com/api",
});

export default API;