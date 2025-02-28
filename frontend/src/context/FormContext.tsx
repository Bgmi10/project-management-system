import { createContext, useContext, useState } from "react";

interface FormContextType {
    isLogin: string;
    setFormType: (type: string) => void; // Fix: Function now correctly accepts a string parameter
}

export const FormContext = createContext<FormContextType>({
    isLogin: "signin",
    setFormType: () => {}, // Default function to prevent errors
});

export function FormProvider({ children }: { children: React.ReactNode }) {
    const [isLogin, setIsLogin] = useState<string>("signin");

    const setFormType = (type: string) => {
        if (isLogin !== type) {
            setIsLogin(type);
        }
    };

    return (
        <FormContext.Provider value={{ isLogin, setFormType }}>
            {children}
        </FormContext.Provider>
    );
}

export const useFormContext = () => useContext(FormContext);
