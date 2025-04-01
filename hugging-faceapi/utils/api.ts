// import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';

// const FASTAPI_BASE_URL = 'http://127.0.0.1:8000';

// export async function sendToFastApi(http: IHttp, endpoint: string, data: any) {
//     try {
//         const response = await http.post(`${FASTAPI_BASE_URL}${endpoint}`, { data });

//         if (response.statusCode === 200) {
//             return { success: true, data: response.data };
//         } else {
//             return { success: false, error: response.content || 'Unknown error' };
//         }
//     } catch (error) {
//         return { success: false, error: error.message };
//     }
// }
