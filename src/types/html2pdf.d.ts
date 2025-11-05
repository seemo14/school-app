declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: Record<string, unknown>
    jsPDF?: Record<string, unknown>
  }

  type Source = HTMLElement | string

  interface Html2PdfInstance {
    set: (options: Html2PdfOptions) => Html2PdfInstance
    from: (element: Source) => Html2PdfInstance
    output: (type?: string) => Promise<Blob | string>
    save: () => Promise<void>
  }

  type Html2PdfFactory = () => Html2PdfInstance

  const html2pdf: Html2PdfFactory
  export default html2pdf
}
