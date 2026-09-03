import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

type Article = {
  id: number;
  title: string;
  reading_time_minutes: number;
  content: string;
};

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [urlInput, setUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error("Erro ao buscar artigos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar nova URL para o Backend
  const handleAddArticle = async () => {
    if (!urlInput.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) throw new Error("Erro ao extrair artigo");

      // Limpa o input e busca a lista atualizada
      setUrlInput('');
      fetchArticles();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar este artigo.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Meus Artigos (Lector)</Text>

      {/* ÁREA DE ADICIONAR NOVO ARTIGO */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Cole o link do artigo aqui..."
          value={urlInput}
          onChangeText={setUrlInput}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={[styles.button, isSaving && styles.buttonDisabled]} 
          onPress={handleAddArticle}
          disabled={isSaving}
        >
          <Text style={styles.buttonText}>{isSaving ? "Extraindo..." : "Salvar"}</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>⏳ {item.reading_time_minutes} min de leitura</Text>
              <Text style={styles.preview} numberOfLines={3}>
                {item.content}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#99C7FF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 5,
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  preview: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
});
