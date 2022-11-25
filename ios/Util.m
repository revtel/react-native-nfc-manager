//
//  Util.m
//  react-native-nfc-manager
//
//  Created by Richie Hsieh on 2022/1/27.
//

#import <Foundation/Foundation.h>

NSString* getHexString(NSData *data) {
    NSUInteger capacity = data.length * 2;
    NSMutableString *sbuf = [NSMutableString stringWithCapacity:capacity];
    const unsigned char *buf = data.bytes;
    NSInteger i;
    for (i=0; i<data.length; ++i) {
        [sbuf appendFormat:@"%02lX", (unsigned long)buf[i]];
    }
    return sbuf;
}

NSString* getErrorMessage(NSError *error) {
     NSDictionary *userInfo = [error userInfo];
     NSError *underlyingError = [userInfo objectForKey:NSUnderlyingErrorKey];
    if (underlyingError != nil) {
        return [NSString stringWithFormat:@"%@:%ld,%@:%ld",
                [error domain], (long)[error code],
                [underlyingError domain], (long)[underlyingError code]];
    }
    return [NSString stringWithFormat:@"%@:%ld",
            [error domain], (long)[error code]];
}

NSData * arrayToData(NSArray *array) {
  Byte bytes[[array count]];
  for (int i = 0; i < [array count]; i++) {
    bytes[i] = [[array objectAtIndex:i] integerValue];
  }
  NSData *payload = [[NSData alloc] initWithBytes:bytes length:[array count]];
  return payload;
}

NSArray * dataToArray(NSData *data) {
    const unsigned char *dataBuffer = data ? (const unsigned char *)[data bytes] : NULL;
    
    if (!dataBuffer)
        return @[];
    
    NSUInteger          dataLength  = [data length];
    NSMutableArray     *array  = [NSMutableArray arrayWithCapacity:dataLength];
    
    for (int i = 0; i < dataLength; ++i)
        [array addObject:[NSNumber numberWithInteger:dataBuffer[i]]];
    
    return array;
}
