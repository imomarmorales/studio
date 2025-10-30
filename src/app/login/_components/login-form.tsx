
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Auth, signInWithCustomToken } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { QrCode } from "lucide-react";

// The "QR Code" is just the user's UID. This schema validates that it's not empty.
const formSchema = z.object({
  qrData: z.string().min(10, { message: "El código de la credencial no es válido." }),
});

// A mock function to simulate fetching a custom token from a backend.
// In a real app, this would be a secure call to a server function.
const getCustomTokenForUid = async (uid: string): Promise<string> => {
    // SECURITY WARNING: This is a mock function for demonstration purposes.
    // In a production environment, you MUST NOT expose a way to generate tokens on the client.
    // This logic MUST live on a secure server (e.g., Cloud Function) that verifies
    // the request's authenticity before creating and returning a token.
    console.warn("Generating custom token on the client. This is insecure and for development only.");
    
    // This is a simplified simulation. A real implementation would require the Firebase Admin SDK on a server.
    // Since we cannot run Admin SDK here, we'll throw an error to guide the developer.
    
    // We will just use the UID as the token for this mock. This won't actually work.
    // We are now just going to sign in anonymously as that user.
    return uid;
};


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qrData: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    
    // In our passwordless setup, the QR code contains the UID.
    const uid = values.qrData;

    toast({
      title: "Procesando credencial...",
      description: "Iniciando sesión.",
    });

    try {
        // Since we cannot securely generate a custom token on the client,
        // we'll simulate the login by signing out any current anonymous user
        // and then just re-directing. The actual auth state won't change
        // to the new user without a proper custom token.
        // For now, we will just assume the user is logging in for the first time.
        // This is a limitation of the current client-only environment.
        
        // This is where you'd use the custom token:
        // const customToken = await getCustomTokenForUid(uid);
        // await signInWithCustomToken(auth, customToken);

        toast({
            title: "Función no implementada",
            description: "El inicio de sesión real con QR requiere un backend seguro. Redirigiendo al dashboard..."
        });

      // We are just navigating, not truly authenticating as the scanned user.
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error al iniciar sesión con QR:", error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "La credencial no es válida o no se pudo autenticar. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl pt-4">Iniciar Sesión con QR</CardTitle>
          <CardDescription>
            Pega el contenido de tu QR para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="qrData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Credencial Digital</FormLabel>
                    <FormControl>
                      <Input placeholder="Pega el código de tu QR aquí..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Acceder
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="underline text-primary">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
