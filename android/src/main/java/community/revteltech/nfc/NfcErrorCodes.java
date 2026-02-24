package community.revteltech.nfc;

public final class NfcErrorCodes {
    public static final String ERR_CANCEL = "cancelled";
    public static final String ERR_NOT_REGISTERED = "you should requestTagEvent first";
    public static final String ERR_MULTI_REQ = "You can only issue one request at a time";
    public static final String ERR_NO_TECH_REQ = "no tech request available";
    public static final String ERR_NO_REFERENCE = "no reference available";
    public static final String ERR_TRANSCEIVE_FAIL = "transceive fail";
    public static final String ERR_API_NOT_SUPPORT = "unsupported tag api";
    public static final String ERR_GET_ACTIVITY_FAIL = "fail to get current activity";
    public static final String ERR_NO_NFC_SUPPORT = "no nfc support";

    private NfcErrorCodes() {
    }
}
