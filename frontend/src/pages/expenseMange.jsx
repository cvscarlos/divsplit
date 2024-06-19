import { ThemeContext } from "../context/ThemeContext";
import ExpenseProvider from "../context/expenseContext";



export function ExpensiveManagePage(){
    return(
        <ExpenseProvider>
        <div data-theme={ThemeContext} className="my-container">
            <div>
                  <h1>Gerencie  suas dispesas aqui</h1>
  
                    
            </div>
          
        
        </div>
        </ExpenseProvider>
    )
}
