import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const fetchSectors = (planet) =>
  axios.get(`${API}/sectors`, { params: planet ? { planet } : {} }).then((r) => r.data);
export const fetchPlanets = () => axios.get(`${API}/planets`).then((r) => r.data.planets);
export const importSectors = (planet, sectors) =>
  axios.post(`${API}/sectors/import`, { planet, sectors, replace: true }).then((r) => r.data);
export const updateSector = (id, data) => axios.put(`${API}/sectors/${id}`, data).then((r) => r.data);
export const deleteSector = (id) => axios.delete(`${API}/sectors/${id}`).then((r) => r.data);
export const clearSectors = (planet) =>
  axios.delete(`${API}/sectors`, { params: planet ? { planet } : {} }).then((r) => r.data);
