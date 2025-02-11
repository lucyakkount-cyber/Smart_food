import axios from "axios"

const axiosIns = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
})

axiosIns.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`

  }
  
  return config
})

export default axiosIns
