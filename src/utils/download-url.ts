export const downloadUrl = async (url: string) => {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();

    const link = document.createElement("a");

    const filename = new URL(url).pathname.split("/").filter(Boolean).pop();

    if (!filename) {
      throw new Error("URL does not contain a valid filename");
    }

    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading the file", error);
  }
};