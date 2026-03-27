import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOGO_IMAGE = require('../assets/images/logo.png');

export function BrandHeader() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
      <View style={styles.container}>
        {/* Left side: Square Logo Box */}
        <View style={styles.logoBox}>
            <Image 
              source={LOGO_IMAGE} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
        </View>
        
        {/* Right side: Branding Text */}
        <View style={styles.rightContent}>
            <Text style={styles.brandName}>
                Carsbuy<Text style={styles.accentText}>Nsell</Text>
            </Text>
            <Text style={styles.subBrand}>by Raj Motors</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
    paddingBottom: 12,
  },
  container: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBox: {
    width: 60, // Square container
    height: 60,
    backgroundColor: '#F3F6FC', // Subtle background for the logo box
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '90%',
    height: '90%',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: '#1C2B4A',
    letterSpacing: -0.2,
  },
  accentText: {
    color: '#3D5BD9',
  },
  subBrand: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#6B7280',
    marginTop: -2,
    letterSpacing: 0.2,
  },
});
