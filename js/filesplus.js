// Name: Files+
// ID: filesplus
// Description: Read and download files.

(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        throw new Error("files extension must be run unsandboxed");
    }

    const MODE_MODAL = "modal";
    const AS_TEXT = "text";
    const AS_DATA_URL = "url";

    let lastOpenedFileName = ""; // Store the last opened file name
    let lastOpenedFileContent = ""; // Store the last opened file content
    let lastOpenedFileBase64 = ""; // Store the last opened file as Base64 URL

    /**
     * @param {string} accept See MODE_ constants above
     * @returns {Promise<File>} The selected file
     */
    const showFilePromptForFile = (accept) =>
        new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = accept;
            input.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    lastOpenedFileName = file.name; // Save the file name
                    resolve(file);
                }
            });
            input.click();
        });

    /**
     * @param {File} file
     * @param {string} as See AS_ constants above
     * @returns {Promise<string>} The file content
     */
    const readFileContent = (file, as) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            if (as === AS_TEXT) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });

    class Files {
        getInfo() {
            return {
                id: "filesplus",
                name: Scratch.translate("Files+"),
                color1: "#fcb103",
                color2: "#db9a37",
                color3: "#db8937",
                blocks: [
                    {
                        opcode: "openFile",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("open a file"),
                    },
                    {
                        opcode: "getFileName",
                        blockType: Scratch.BlockType.REPORTER,
                        text: Scratch.translate("get last opened file name"),
                    },
                    {
                        opcode: "getFileContentOrBase64",
                        blockType: Scratch.BlockType.REPORTER,
                        text: Scratch.translate("get [type] of last opened file"),
                        arguments: {
                            type: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "contentTypeMenu",
                                defaultValue: "content",
                            },
                        },
                    },
                ],
                menus: {
                    contentTypeMenu: {
                        acceptReporters: true,
                        items: [
                            { text: Scratch.translate("content"), value: "content" },
                            { text: Scratch.translate("base64 URL"), value: "base64" },
                        ],
                    },
                },
            };
        }

        async openFile() {
            try {
                const file = await showFilePromptForFile("");
                lastOpenedFileContent = await readFileContent(file, AS_TEXT); // Save the file content
                lastOpenedFileBase64 = await readFileContent(file, AS_DATA_URL); // Save the file as Base64 URL
            } catch (e) {
                console.error("Failed to open file:", e);
            }
        }

        getFileName() {
            return lastOpenedFileName || "No file opened";
        }

        getFileContentOrBase64(args) {
            const type = args.type;
            if (type === "content") {
                return lastOpenedFileContent || "No file content available";
            } else if (type === "base64") {
                return lastOpenedFileBase64 || "No Base64 URL available";
            }
            return "Invalid type";
        }
    }

    Scratch.extensions.register(new Files());
})(Scratch);