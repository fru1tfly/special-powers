import axios from '../stores/axios'

export function useSaveGameData() {
    const saveGameData = (newData) => {
        return axios.post(
            `${import.meta.env.VITE_API_URL}/file/update/game`,
            newData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).catch(err => {
            console.error(err);
        });
    }

    return { saveGameData };
}

export function useGetGameData() {
    const getGameData = async () => {
        return await axios.get(
            `${import.meta.env.VITE_API_URL}/file/game`
        );
    }

    return getGameData;
}