---
title: React Native之相机扫码
date: 2019-10-02 11:30:12
tags: 
 - RN
 - react
categories: Front-End
---

> - 本文介绍`react-native-camera`扫码的应用
> - 更多详情文档 https://github.com/react-native-community/react-native-camera

**效果展示**

![](https://poetries1.gitee.io/img-repo/2019/10/676.png)

**配置**

```
react-native link react-native-camera
```

```js
// 配置andriod/app/src/build.gradle 

defaultConfig {
    applicationId "com.jtyapps"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0"
    ndk {
        abiFilters "armeabi-v7a", "x86"
    }
    // 添加这里
    missingDimensionStrategy 'react-native-camera', 'general'
}

// 配置andriod/gradle/wrapper/gradle-wrapper.properties
// 本教程使用的是这个版本
distributionUrl=https\://services.gradle.org/distributions/gradle-4.10.1-all.zip
```

**添加相机权限**

> `andriod/app/src/main/AndroidManifest.xml`

```html
  <uses-permission android:name="android.permission.BLUETOOTH"/>
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGEE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.CAMERA"/> 
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-feature android:name="android.hardware.camera" android:required="false"/>
  <uses-feature android:name="android.hardware.camera.front" android:required="false"/>
```



**处理逻辑**

```js
// scan.js
import React, { Component } from 'react';

import {
    View,
    Text,
    StyleSheet,
    Image,
    Platform,
    Vibration,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
const { width, height } = Dimensions.get('window');
import { Modal } from '@ant-design/react-native';

import {RNCamera} from 'react-native-camera';
import ViewFinder from './ViewFinder';

import scanLine from '../../assets/images/scan_line.png';
import { scaleSizeW, scaleSizeH, setSpText } from '../../utils/scale';

export default class MyScan extends Component {
    static navigationOptions = ({ navigation, navigationOptions }) => {
		return({
			header: null
		})
	};
    constructor(props) {
        super(props);
        this.camera = null;
        this.state = {
            openFlash: false,
            active: true,
            flag: true,
            fadeInOpacity: new Animated.Value(0), // 初始值
            isEndAnimation: false,//结束动画标记
            key: ''
        }

    }
    componentDidMount() {
        const {navigation} = this.props;
    
        this._startAnimation(false);
    }
    componentWillReceiveProps(nProps) {
        const {key } = this.state;
        const {navigation} = nProps;

        let newKey = navigation.getParam('key');

        if(key!=newKey){
            this.transCode = '';
            this.setState({
                key: newKey
            })
        }
        console.log('scan进来了')
      }

    //开始动画，循环播放
    _startAnimation = (isEnd) => {
        Animated.timing(this.state.fadeInOpacity, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear
        }).start(
            () => {
                if (isEnd) {
                    this.setState({
                        isEndAnimation: true
                    })
                    return;
                }
                if (!this.state.isEndAnimation) {
                    this.state.fadeInOpacity.setValue(0);
                    this._startAnimation(false)
                }
            }
        );
        // console.log("开始动画");
    }
    barcodeReceived (e){
        const {navigation:{navigate}} = this.props;
        if (e.data !== this.transCode) {
            Vibration.vibrate([0, 500, 200, 500]);
            this.transCode = e.data; // 放在this上，防止触发多次，setstate有延时
            if (this.state.flag) {
                this.changeState(false);
            }
            console.log("transCode=" + this.transCode);
            Modal.alert('温馨提示', `确定绑定: ${this.transCode} 吗？`, [
                {
                  text: '取消',
                  onPress: () => console.log('cancel'),
                  style: 'cancel',
                },
                { text: '确定', onPress: () => {
                    navigate('Record')
                    // dispatch({
                    //     type: 'user/bindHeartDev',
                    //     callback: res=>{
                    //         if(res.code == 200) {
                    //             navigate('Record')
                    //         }
                    //     }
                    // })
                } },
            ]);
        }
    }
    //返回按钮点击事件
    _goBack = () => {
        this.setState({
            isEndAnimation: true,
        });
        this.props.navigation.goBack();
    }
    //开灯关灯
    _changeFlash = () => {
        this.setState({
            openFlash: !this.state.openFlash,
        });
    }
    //改变请求状态
    changeState = (status) => {
        this.setState({
            flag: status
        });
        console.log('status=' + status);
    }

    render() {
        const {
            openFlash,
            active,
        } = this.state;
        return (
            <View style={styles.allContainer}>
                <RNCamera
                    barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
                    onBarCodeRead={this.barcodeReceived.bind(this)}
                    onCameraReady={() => {
                        console.log('ready')
                    }}
                    permissionDialogTitle={'Permission to use camera'}
                    permissionDialogMessage={'We need your permission to use your camera phone'}
                    // defaultVideoQuality={RNCamera.Constants.VideoQuality["480p"]}
                    style={styles.cameraStyle}
                >
                    <View style={styles.container}>
                        <View style={styles.titleContainer}>
                            <View style={styles.leftContainer}>
                                <TouchableOpacity activeOpacity={1} onPress={this._goBack}>
                                    <View>
                                        {/* <Image style={styles.backImg} source={backIcon} /> */}
                                        <Icon name="chevron-left" style={styles.backIcon}/>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.centerContainer} />
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.fillView} />
                        <View style={styles.scan}>
                            <ViewFinder />
                            <Animated.View style={[styles.scanLine, {
                                opacity: 1,
                                transform: [{
                                    translateY: this.state.fadeInOpacity.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, scaleSizeH(300)]
                                    })
                                }]
                            }]}>
                                <Image source={scanLine} />
                            </Animated.View>
                        </View>
                        <View style={styles.fillView} />
                    </View>
                    <View style={styles.bottomContainer}>
                        <Text
                            style={[
                                styles.text,
                                {
                                    textAlign: 'center',
                                    width: 220,
                                    marginTop: active ? 25 : 245,
                                },
                            ]}
                            numberOfLines={2}
                        >
                            请将手表二维码放入扫码框内
                                </Text>
                       {/** <TouchableOpacity onPress={this._changeFlash}>
                            <View style={styles.flash}>
                                <Text style={styles.icon}>(・◇・)</Text>
                                <Text style={styles.text}>
                                    开灯/关灯
                                        </Text>
                            </View>
                        </TouchableOpacity>  */}
                        
                    </View>
                </RNCamera> 
            </View>
        )
    }
}

const styles = StyleSheet.create({
    allContainer: {
        flex: 1,
    },
    container: {
        ...Platform.select({
            ios: {
                height: 64 + StatusBar.currentHeight,
            },
            android: {
                height: 50 + StatusBar.currentHeight,
            }
        }),
        backgroundColor: '#000',
        opacity: 0.5
    },
    titleContainer: {
        flex: 1,
        ...Platform.select({
            ios: {
                paddingTop: 15,
            },
            android: {
                paddingTop: 0,
            }
        }),
        flexDirection: 'row',
    },
    leftContainer: {
        flex: 0,
        justifyContent: 'center',
    },
    backIcon: {
        marginLeft: 10,
        fontSize: 30,
        color: '#fff'
    },
    cameraStyle: {
        alignSelf: 'center',
        width: width,
        height: height,
    },
    flash: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 60,
    },
    flashIcon: {
        fontSize: 1,
        color: '#fff',
    },
    text: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5
    },
    icon: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'iconfont'
    },
    scanLine: {
        alignSelf: 'center',
    },
    centerContainer: {
        ...Platform.select({
            ios: {
                height: 80,
            },
            android: {
                height: 60,
            }
        }),
        width: width,
        backgroundColor: '#000',
        opacity: 0.5
    },
    bottomContainer: {
        alignItems: 'center',
        backgroundColor: '#000',
        alignSelf: 'center',
        opacity: 0.5,
        flex: 1,
        width: width
    },
    fillView: {
        width: (width - scaleSizeH(300)) / 2,
        height: scaleSizeH(300),
        backgroundColor: '#000',
        opacity: 0.5
    },
    scan: {
        width: scaleSizeH(300),
        height: scaleSizeH(300),
        alignSelf: 'center'
    },
    info:{
        color: '#fff'
    }

})
```

```js
// ViewFinder.js
import React, {
    Component,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { scaleSizeW, scaleSizeH, setSpText } from '../../utils/scale';


export default class Viewfinder extends Component {
    constructor(props) {
        super(props);

    }

    getBackgroundColor = () => {
        return ({
            backgroundColor: this.props.backgroundColor,
        });
    }

    getEdgeColor = () => {
        return ({
            borderColor: this.props.color,
        });
    }

    getSizeStyles = () => {
        return ({
            height: this.props.height,
            width: this.props.width,
        });
    }

    getEdgeSizeStyles = () => {
        return ({
            height: this.props.borderLength,
            width: this.props.borderLength,
        });
    }

    renderLoadingIndicator = () => {
        if (!this.props.isLoading) {
            return null;
        }

        return (
            <ActivityIndicator
                animating={this.props.isLoading}
                color={this.props.color}
                size="large"
            />
        );
    }

    render() {
        return (
            <View style={[styles.container, this.getBackgroundColor()]}>
                <View style={[styles.viewfinder, this.getSizeStyles()]}>
                    <View
                        style={[
                            this.getEdgeColor(),
                            this.getEdgeSizeStyles(),
                            styles.topLeftEdge,
                            {
                                borderLeftWidth: this.props.borderWidth,
                                borderTopWidth: this.props.borderWidth,
                            },
                        ]}
                    />
                    <View
                        style={[
                            this.getEdgeColor(),
                            this.getEdgeSizeStyles(),
                            styles.topRightEdge,
                            {
                                borderRightWidth: this.props.borderWidth,
                                borderTopWidth: this.props.borderWidth,
                            },
                        ]}
                    />
                    {this.renderLoadingIndicator()}
                    <View
                        style={[
                            this.getEdgeColor(),
                            this.getEdgeSizeStyles(),
                            styles.bottomLeftEdge,
                            {
                                borderLeftWidth: this.props.borderWidth,
                                borderBottomWidth: this.props.borderWidth,
                            },
                        ]}
                    />
                    <View
                        style={[
                            this.getEdgeColor(),
                            this.getEdgeSizeStyles(),
                            styles.bottomRightEdge,
                            {
                                borderRightWidth: this.props.borderWidth,
                                borderBottomWidth: this.props.borderWidth,
                            },
                        ]}
                    />
                </View>
            </View>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    viewfinder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    topLeftEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    topRightEdge: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    bottomLeftEdge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    bottomRightEdge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
});


Viewfinder.defaultProps = {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderLength: 20,
    color: '#1DBAF1',
    height: scaleSizeH(300),
    isLoading: false,
    width: scaleSizeH(300),
};
```

```js
// 使用方式
onScan = ()=>{
    const { navigate } = this.props.navigation;
    // 跳转到扫码页面即可打开
    navigate('Scan')
}
````