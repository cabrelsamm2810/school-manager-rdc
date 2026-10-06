import { RegisterForm } from './RegisterForm';

export function RegisterLayout() {
  return (
    <div className="reg-layout">
      {/* Form panel */}
      <div className="reg-layout-form">
        <RegisterForm />
      </div>
    </div>
  );
}
