#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RNNfcDataResultBlock)(NSArray<NSNumber *> * _Nullable response, NSError * _Nullable error);
typedef void (^RNNfcIsoDepResultBlock)(NSArray<NSNumber *> * _Nullable response, NSNumber * _Nullable sw1, NSNumber * _Nullable sw2, NSError * _Nullable error);
typedef void (^RNNfcIso15693SystemInfoResultBlock)(NSDictionary * _Nullable systemInfo, NSError * _Nullable error);
typedef void (^RNNfcIso15693BlocksResultBlock)(NSArray * _Nullable blocks, NSError * _Nullable error);
typedef void (^RNNfcVoidResultBlock)(NSError * _Nullable error);
typedef void (^RNNfcIso15693SendRequestResultBlock)(NSNumber * _Nullable responseFlag, NSArray<NSNumber *> * _Nullable response, NSError * _Nullable error);
typedef void (^RNNfcResponseSenderBlock)(NSArray * _Nonnull response);

NS_ASSUME_NONNULL_END
