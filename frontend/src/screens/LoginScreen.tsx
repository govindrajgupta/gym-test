import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { supabase } from '../supabase';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_REDIRECT_URI } from '../config';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_IOS_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const { code } = response.params;

      AuthSession.exchangeCodeAsync(
        {
          code,
          clientId: GOOGLE_IOS_CLIENT_ID,
          redirectUri: GOOGLE_REDIRECT_URI,
          extraParams: { code_verifier: request?.codeVerifier ?? '' },
        },
        discovery
      )
        .then(async (tokenResponse) => {
          const idToken = tokenResponse.idToken;
          if (!idToken) {
            Alert.alert('Error', 'No ID token received');
            setLoading(false);
            return;
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          if (error) {
            Alert.alert('Sign In Error', error.message);
          }
          setLoading(false);
        })
        .catch((err) => {
          Alert.alert('Error', err.message);
          setLoading(false);
        });
    } else if (response.type === 'error') {
      Alert.alert('Auth Error', response.error?.message ?? 'Authentication failed');
      setLoading(false);
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      setLoading(false);
    }
  }, [response]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.headerTitle}>Sign Up</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Welcome! Manage, Track{'\n'}and Grow your Gym with{'\n'}WellVantage.
          </Text>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              setLoading(true);
              promptAsync();
            }}
            disabled={!request || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#444" />
            ) : (
              <>
                <Image
                  source={require('../../assets/google_logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backArrow: {
    fontSize: 22,
    color: '#000',
    width: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    width: 32,
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 26,
    color: '#000',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 36,
    fontWeight: '700',
    paddingHorizontal: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 2,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3c4043',
    letterSpacing: 0.2,
  },
});
