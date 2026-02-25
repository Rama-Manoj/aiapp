package com.example.aiapp.dto;

public class UserResponseDto {

    private Long id;
    private String name;
    private String email;
    private String role;
    
    public UserResponseDto() {
		// TODO Auto-generated constructor stub
	}

	public UserResponseDto(Long id, String name, String email, String role) {
		super();
		this.id = id;
		this.name = name;
		this.email = email;
		this.role = role;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}
    
    
	



}
