import axios from '../../stores/axios'

export function useGetFileData() {
    const getFileData = (file, destination) => {
        const form = new FormData();
        form.append('destination', destination);
        form.append('file', file);

        return axios.get(
            `${import.meta.env.VITE_API_URL}/file/assets`,
        ).then((response) => {
            return response;
        });
    }

    return { getFileData };
}
