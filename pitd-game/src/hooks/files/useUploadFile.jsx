import { useState } from 'react';
import axios from '../../stores/axios'

export function useUploadFile() {
    const [isLoading, setIsLoading] = useState(false);

    const uploadFile = (file, destination) => {
        setIsLoading(true);

        const form = new FormData();
        form.append('destination', destination);
        form.append('file', file);

        return axios.post(
            `${import.meta.env.VITE_API_URL}/file/upload`,
            form,
	    {
	        headers: {
		    "Content-Type": "multipart/form-data"
		}
	    }
        ).then((response) => {
            return response.data.file.replaceAll('\\', '/');
        });
    }

    return { isLoading, setIsLoading, uploadFile };
}
