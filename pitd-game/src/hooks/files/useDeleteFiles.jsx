import axios from '../../stores/axios'

export function useDeleteFiles() {
    const deleteFiles = (urls) => {
        return axios.post(
            `${import.meta.env.VITE_API_URL}/file/delete`,
            { urls }
        ).then((response) => {
            return response.data.results;
        });
    }

    return { deleteFiles };
}
