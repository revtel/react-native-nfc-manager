# Android same-session NDEF write/read validation — 2026-10-23

## Test identity

- Platform/device: physical Samsung SM-N975U1, Android 12 (API 31).
- Consumer: RN CLI `example/`, React Native 0.84, New Architecture.
- Library: main commit `09f8af005ba692dd4179b2828fc71246d80bf3b4`, package version 4.0.0,
  with local example-only test additions. This is not a packed-release test.
- Tag: writable NFC Forum Type 2; Android technologies NfcA, MifareUltralight,
  Ndef; reported capacity 492 bytes; ID `0480A472AE4F81`. Exact chip/model not
  independently identified. User authorized overwriting this dedicated test tag.
- Test helper SHA-256: `61dd4df0058d1c34560d682373a72e4cdb473ae858f83f948accde2e04a74634`.
- App source SHA-256: `7d5f6ba1633520d07de1d587a4de430ac5bcf0148369cbfbe7fa079697ccc48a`.
- Times below are Asia/Taipei on 2026-10-23. User physically presented the tag;
  the agent independently inspected logcat and decoded returned payload bytes.

## Successful same-session regression (PR #843)

The harness reads cached discovery metadata for preflight, checks writable
status/capacity, then writes two distinct text records through one Ndef request.
Each write explicitly uses `reconnectAfterWrite: false` and is followed by
`ndefHandler.getNdefMessage()`. No cancellation, reconnect, or new request occurs
between these writes/reads in the harness. The captured interval contains one
discovery and cleanup after both operations.

| Time | Observed operation/result |
| --- | --- |
| 09:47:32.002 | Cached discovery identifies the tag above; writable, 492 bytes. |
| 09:47:32.007 | `getNdefStatus()`: status 2, capacity 492. |
| 09:47:32.091 | Wrote `NFC843-1792720052007-A`. |
| 09:47:32.127–.128 | Live read returned the same tag ID and text A; `PASS same-session 1/2`. |
| 09:47:32.205 | Wrote `NFC843-1792720052007-B`. |
| 09:47:32.239 | Live read returned the same tag ID and text B; `PASS same-session 2/2`. |
| 09:47:33.298–.302 | `unregisterTagEvent`, foreground dispatch disabled, `cleanup completed`. |

Both records have TNF 1 and type `[84]` (text). The payload prefix is
`[2, 101, 110]` (UTF-8 text, language `en`); independently decoding the
remaining bytes reproduced the exact A and B strings above. The second read
therefore returned the second write rather than discovery-time content or A.

## Persistence and repeated full cycle

The user confirmed removing and re-presenting the tag for persistence checks
and repeating the complete write/read/cleanup/re-scan sequence. Logcat records
new requests and NDEF discovery for each re-scan and the second write cycle.

| Time | Observed operation/result |
| --- | --- |
| 09:56:07.616 | First re-scan live read: `NFC843-1792720052007-B`; same tag ID; `PASS saved content`. |
| 09:56:08.672–.675 | First re-scan cleanup: unregister, dispatch disabled, `cleanup completed`. |
| 09:56:31.051–.055 | Second cycle discovery contains first cycle B; writable status 2, capacity 492. |
| 09:56:31.136 | Wrote `NFC843-1792720591055-A`. |
| 09:56:31.173 | Live read returns second cycle A; `PASS same-session 1/2`. |
| 09:56:31.250 | Wrote `NFC843-1792720591055-B`. |
| 09:56:31.289–.290 | Live read returns second cycle B; `PASS same-session 2/2`. |
| 09:56:32.343–.345 | Second write cycle cleanup completed, dispatch disabled. |
| 09:56:37.943 | Second re-scan live read: `NFC843-1792720591055-B`; same tag ID; `PASS saved content`. |
| 09:56:38.999–09:56:39.002 | Second re-scan cleanup completed, dispatch disabled. |

Independent decoding/comparison of log payloads confirmed four distinct writes
and four matching live readbacks, plus two re-scans matching their respective
final B text. All six reads identify `0480A472AE4F81`; all four requests have
successful cleanup. There are no `[NDEF843] FAIL` entries in these successful
cycles (09:47:29–09:56:39). The initial failed attempt below is not counted as
a pass or omitted from the assessment.

**Pass:** PR #843's same-session live-read regression, persistence after user-
confirmed removal/re-scan, cleanup, and a repeated complete cycle on this
device/tag. The first successful write cycle began with an empty tag; the
second overwrote the previously saved message. User reports and independently
inspected log payloads agree. This closes the maintainer writable-tag evidence
gap for this combination; it does not establish other device/tag behavior.

## Earlier failed attempt and limits

At 09:30:34–09:30:37, the initial harness performed a live read before writing
the empty tag. It returned an empty message, then the first write failed with
`java.io.IOException: Tag is not ndef`; cleanup completed. Replacing only the
preflight read with cached `getTag()` and restarting the app preceded the
successful retry. This suggests an empty-tag/live-preflight interaction but
does not isolate its cause; no library/native workaround was introduced.

Cancellation during writing, tag removal during I/O, reproduction/root-cause
isolation of the initial empty-tag failure, and cross-device behavior remain
unverified. No iOS NDEF or Expo hardware claim is made. Root checks and the
Android debug app build passed; example mocked tests (20) passed, but these
software checks are separate from the physical-device result above.
