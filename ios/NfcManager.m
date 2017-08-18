#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"

@implementation NfcManager

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(start: (nonnull RCTResponseSenderBlock)callback)
{
    NSLog(@"NfcManager initialized");
    callback(@[]);
}

@end
  