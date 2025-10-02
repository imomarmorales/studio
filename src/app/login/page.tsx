"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

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
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useAuth } from "@/firebase";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, ingresa un correo válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }), // Simple check for presence
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth: Auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de vuelta.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Las credenciales son incorrectas. Inténtalo de nuevo.",
      });
    }
  }

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        variant: "destructive",
        title: "Correo no especificado",
        description: "Por favor, ingresa tu correo para restablecer la contraseña.",
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el correo de restablecimiento.",
      });
    }
  };


  return (
    <PublicLayout>
      <div className="container flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Institucional</FormLabel>
                      <FormControl>
                        <Input placeholder="alumno@uat.edu.mx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Iniciar Sesión
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
             <Button variant="link" onClick={handlePasswordReset}>¿Olvidaste tu contraseña?</Button>
             <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="underline text-primary">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
