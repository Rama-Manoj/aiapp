package com.example.aiapp.dto;

public class UpdateUserRequestDto {

    private Long id;
    private String name;
    private String email;
    private String password; // optional

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public UpdateUserRequestDto() {
		// TODO Auto-generated constructor stub
	}
	public UpdateUserRequestDto(Long id, String name, String email, String password) {
		super();
		this.id = id;
		this.name = name;
		this.email = email;
		this.password = password;
	}
    
    
    
}
