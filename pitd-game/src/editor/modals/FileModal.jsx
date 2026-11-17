import { useContext, useEffect, useRef, useState } from "react";
import { useUploadFile } from "../../hooks/files/useUploadFile";
import { useGetFileData } from "../../hooks/files/useGetFileData";
import { useDeleteFiles } from "../../hooks/files/useDeleteFiles";
import { addAudio, addImage } from "../../gameData/assetManager";
import { EditorContext } from "../EditorContext";
import { getAllStrings } from "../../gameData/gameDataHelper";

export default function FileModal({ fileType, multi, addFiles }) {

    const [isLoading, setIsLoading] = useState(true);
    const [fileList, setFileList] = useState([]);
    const [selected, setSelected] = useState([]);

    const [needsRefresh, setNeedsRefresh] = useState(true);

    const { uploadFile } = useUploadFile();
    const { deleteFiles } = useDeleteFiles();
    const editorState = useContext(EditorContext);


    let directory;
    let title;
    let urlDirectory;

    if (fileType === 'image') {
        title = "Images";

        directory = 'public/images/sprites';
        urlDirectory = '/images/sprites';
    } else if (fileType === 'audio') {
        title = "Sounds";

        directory = 'public/audio/sounds';
        urlDirectory = '/audio/sounds';
    }

    const { getFileData } = useGetFileData();

    useEffect(() => {
        async function getData() {
            const fileStructure = await getFileData();
            const usedStrings = Array.from(getAllStrings(editorState));

            setFileList(fileStructure.data
                .filter(f => f.parentPath === directory)
                .map(f => {
                    const url = `${urlDirectory}/${f.name}`;
                    return {
                        url,
                        inUse: usedStrings.some(s => s === url || s.endsWith(url))
                    };
                }));

            setIsLoading(false);
            setNeedsRefresh(false);
        }

        if (needsRefresh) {
            setIsLoading(true);
            getData();
        }
    }, [needsRefresh]);

    const selectFile = (index) => {
        const targetValue = fileList[index].url;
        const alreadySelected = selected.includes(targetValue);

        if (!alreadySelected) {
            if (multi) {
                setSelected([
                    ...selected,
                    targetValue
                ])
            } else {
                setSelected([targetValue]);
            }
        } else {
            setSelected(selected.filter(s => s !== targetValue));
        }
    }

    const handleDeselectAll = () => {
        setSelected([]);
    }

    const handleDeleteSelected = async () => {
        if (selected.length === 0) return;

        await handleDeleteFiles(selected);
    }

    const handleDeleteFiles = async (files) => {
        const results = await deleteFiles(files);
        const failed = results.filter(r => !r.deleted);
        if (failed.length > 0) {
            console.error('Failed to delete files:', failed);
        }

        // Deselect anything that was actually deleted; failed ones stay selected
        const deleted = results.filter(r => r.deleted).map(r => r.url);
        setSelected(prev => prev.filter(s => !deleted.includes(s)));
        setNeedsRefresh(true);
    }

    const uploadMulti = async (event) => {
        const files = Array.from(event.target.files);

        const newUrls = await Promise.all(files.map(async (file) => {
            const newUrl = await uploadFile(file, urlDirectory, true);
            return newUrl;
        }));

        if (fileType === 'image') {
            await Promise.all(newUrls.map(url => addImage(url)));
        } else if (fileType === 'audio') {
            await Promise.all(newUrls.map(url => addAudio({ url })));
        }
        setNeedsRefresh(true);
    }

    const handleAddFiles = async () => {
        if (fileType === 'image') {
            await Promise.all(selected.map(url => addImage(url)));
        } else if (fileType === 'audio') {
            await Promise.all(selected.map(url => addAudio({ url })));
        }

        const param = multi ? selected : selected[0];
        addFiles(param);
    }

    const handleCancel = () => {
        addFiles([]);
    }

    const selectedInUse = fileList.filter(f => selected.includes(f.url) && f.inUse);

    const enableWithSelectionClass = selected.length > 0 ? 'modal-footer-button' : 'modal-footer-button disabled-btn';
    const deleteButtonClass = selectedInUse.length === 0 && selected.length > 0
        ? 'modal-footer-button' 
        : 'modal-footer-button disabled-btn';

    return <div className="editor-modal file-modal tall-modal">
        <div className="effect-title">
        <div className="modal-field-label">{title}</div>
        <button onClick={handleCancel}>Back</button>
        </div>
        <div className="modal-card-container">
            {isLoading && 
                <p className="modal-card-container-loading-text">loading...</p>
            }
            {!isLoading &&
                fileList.map((f, ind) => {
                    const isSelected = selected.includes(f.url);
                    const selectedIndex = selected.indexOf(f.url);
                    const fileName = f.url.slice(f.url.lastIndexOf('/') + 1);

                    return <>
                        {fileType === 'image' && 
                            <div className="file-modal-card" onClick={() => selectFile(ind)}>
                                    <img className="file-modal-card-image" src={`${import.meta.env.VITE_DOMAIN}${f.url}`} />

                                {fileType === 'audio' && 
                                    <>
                                        <div>{fileName}</div>
                                        <audio src={`${import.meta.env.VITE_DOMAIN}${f.url}`} controls/>
                                    </>
                                }
                                {isSelected && 
                                    <div className="selected-modal-card-container">
                                        {multi && 
                                            <div className="selected-index-text">
                                                {selectedIndex + 1}
                                            </div>
                                        }
                                    </div>
                                }
                                {!f.inUse && !isSelected &&
                                    <div className="unused-modal-card-container">
                                        Not Used
                                    </div>
                                }
                            </div>
                        }
                        {fileType === 'audio' &&
                            <div className="file-modal-audio-card">
                                <div className="file-modal-audio-card-actions">
                                    
                                    {!f.inUse ? (
                                        <div className="file-audio-status-unused">Not Used</div>
                                    ) : (
                                        <div className="file-audio-status-used">Used</div>
                                    )}
                                    <div className="file-audio-action-btns">
                                        {!f.inUse && <button onClick={() => handleDeleteFiles([f.url])}>Delete</button>}
                                        {!isSelected && <button className="action-btn" onClick={() => selectFile(ind)}>Select</button>}
                                        {isSelected && <button onClick={handleDeselectAll}>Deselect</button>}
                                    </div>
                                </div>
                                <div className="file-modal-audio-title">{fileName}</div>
                                <audio src={`${import.meta.env.VITE_DOMAIN}${f.url}`} controls />
                                {isSelected && 
                                    <div className="selected-modal-card-container">
                                        {multi && 
                                            <div className="selected-index-text">
                                                {selectedIndex + 1}
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        }
                    </>;
                })
            }
        </div>
        <div className="modal-stacked-footer">
            {multi &&
                <div className="modal-footer">
                    <button className={deleteButtonClass} onClick={handleDeleteSelected}>Delete Selected</button>
                    <button className={enableWithSelectionClass} onClick={handleDeselectAll}>Deselect All</button>
                </div>
            }
            <div className="modal-footer">
                <label htmlFor="sprite" className="uploadLabel modal-footer-button">Upload New</label>
                <input type="file" accept={`${fileType}/*`} id="sprite" multiple={multi} onChange={uploadMulti} /> 
                <button onClick={handleAddFiles} className={`${enableWithSelectionClass} action-btn`}>Select File{selected.length > 1 ? 's' : ''}</button>
            </div>
        </div>
    </div>;
}